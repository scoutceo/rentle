-- Ensure apartments are unique by identity (prevent duplicate seeding)
ALTER TABLE apartments ADD CONSTRAINT apartments_identity_unique
  UNIQUE (city, neighborhood, address_label);

-- daily_pairs: ensure unique per date + round (prevent duplicate seeding)
ALTER TABLE daily_pairs ADD CONSTRAINT daily_pairs_date_round_unique
  UNIQUE (date, round_number);
