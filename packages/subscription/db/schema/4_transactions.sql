SET ROLE subscription;

DROP TYPE IF EXISTS transaction_type;
CREATE TYPE transaction_type AS ENUM ('trial', 'renewal', 'refund');

CREATE TABLE client_transactions (
    transaction_type transaction_type NOT NULL,
    event_date date NOT NULL,
    account_id uuid NOT NULL,
    client_purchase numeric NOT NULL DEFAULT '0.00',
    developer_proceeds numeric NOT NULL DEFAULT '0.00',
    base_client_purchase numeric NOT NULL DEFAULT '0.00',
    base_developer_proceeds numeric NOT NULL DEFAULT '0.00',
    subscription_group_id text NOT NULL,
    subscription_package_id text NOT NULL,
    client_id text NOT NULL,
    application_id text NOT NULL,
    client_currency_id text NOT NULL REFERENCES currencies (currency_id),
    developer_currency_id text NOT NULL REFERENCES currencies (currency_id),
    base_currency_id text NOT NULL REFERENCES currencies (currency_id),

    FOREIGN KEY (account_id, subscription_package_id, client_id)
        REFERENCES client_subscriptions,

    FOREIGN KEY (account_id, client_id)
        REFERENCES clients,

    UNIQUE (account_id, client_id, event_date, transaction_type, subscription_group_id, subscription_package_id)
);

CREATE INDEX ON client_transactions (account_id, event_date);

GRANT SELECT, INSERT, UPDATE, DELETE ON client_transactions TO "subscription-worker";

CREATE OR REPLACE FUNCTION client_transactions_update_subscription()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        UPDATE client_subscriptions
        SET active_period = daterange(
				LEAST(lower(active_period), NEW.event_date),
				GREATEST(
					upper(active_period),
						CASE NEW.transaction_type
						WHEN 'trial' THEN (NEW.event_date + free_trial_duration)::date
						WHEN 'renewal' THEN (NEW.event_date + subscription_duration)::date
						WHEN 'refund' THEN (NEW.event_date + interval '1 day')::date
					END
				)
			),
            total_base_client_purchase = total_base_client_purchase + NEW.base_client_purchase,
            total_base_developer_proceeds = total_base_developer_proceeds + NEW.base_developer_proceeds
        WHERE account_id = NEW.account_id AND
              client_id = NEW.client_id AND
              subscription_package_id = NEW.subscription_package_id;

        RETURN NEW;
    END;
$$;

CREATE TRIGGER client_transactions_after_insert
    AFTER INSERT ON client_transactions
    FOR EACH ROW
    EXECUTE FUNCTION client_transactions_update_subscription();

CREATE OR REPLACE FUNCTION client_transactions_set_client_interaction_date()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
        UPDATE clients
        SET first_interaction = LEAST(first_interaction, NEW.event_date),
            total_base_client_purchase = total_base_client_purchase + NEW.base_client_purchase,
            total_base_developer_proceeds = total_base_developer_proceeds + NEW.base_developer_proceeds
        WHERE account_id = NEW.account_id AND
              client_id = NEW.client_id;

        RETURN NEW;
    END;
$$;

CREATE TRIGGER client_transactions_after_insert_update_client
    AFTER INSERT ON client_transactions
    FOR EACH ROW
    EXECUTE FUNCTION client_transactions_set_client_interaction_date();