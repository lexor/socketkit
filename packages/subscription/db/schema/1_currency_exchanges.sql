SET ROLE subscription;

CREATE TABLE currency_exchanges (
  currency_id text NOT NULL,
  exchange_date date NOT NULL,
  amount money_value NOT NULL,

  PRIMARY KEY (currency_id, exchange_date),

  CONSTRAINT currency_exchanges_currency_id_check
    CHECK (currency_id ~ '\A[A-Z]{3}\Z')
);

CREATE INDEX ON currency_exchanges (exchange_date);

GRANT SELECT, INSERT ON currency_exchanges TO "subscription-worker";
