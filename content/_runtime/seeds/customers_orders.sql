-- Seed for lesson 121's customers/orders query.
--
-- Shaped so the query it feeds actually discriminates, rather than returning
-- everything or nothing:
--   * order counts run 0..6, so `HAVING COUNT(o.id) > 2` keeps some customers
--     and drops others;
--   * some orders are deliberately older than 30 days, so the WHERE window is
--     doing visible work — one customer has three orders, all of them old, and
--     therefore disappears entirely;
--   * dates are relative to now(), so the 30-day window keeps meaning the same
--     thing however long from now this page is opened.
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
  id   int PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE orders (
  id          int PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers (id),
  total_cents int NOT NULL,
  created_at  timestamptz NOT NULL
);

INSERT INTO customers (id, name) VALUES
  (1, 'Ada Lovelace'),
  (2, 'Grace Hopper'),
  (3, 'Alan Turing'),
  (4, 'Katherine Johnson'),
  (5, 'Linus Torvalds'),
  (6, 'Barbara Liskov'),
  (7, 'Ken Thompson'),
  (8, 'Margaret Hamilton');

INSERT INTO orders (id, customer_id, total_cents, created_at) VALUES
  (1, 1, 6921, now() - interval '7 days'),
  (2, 1, 39460, now() - interval '28 days'),
  (3, 1, 27267, now() - interval '21 days'),
  (4, 1, 12763, now() - interval '20 days'),
  (5, 1, 35444, now() - interval '6 days'),
  (6, 1, 22859, now() - interval '49 days'),
  (7, 2, 13299, now() - interval '28 days'),
  (8, 2, 42954, now() - interval '14 days'),
  (9, 2, 5022, now() - interval '22 days'),
  (10, 2, 40830, now() - interval '14 days'),
  (11, 2, 9748, now() - interval '32 days'),
  (12, 2, 32044, now() - interval '58 days'),
  (13, 3, 23443, now() - interval '15 days'),
  (14, 3, 39753, now() - interval '8 days'),
  (15, 4, 10984, now() - interval '12 days'),
  (16, 4, 13210, now() - interval '14 days'),
  (17, 4, 8766, now() - interval '11 days'),
  (18, 4, 16661, now() - interval '72 days'),
  (19, 5, 29202, now() - interval '17 days'),
  (20, 6, 33213, now() - interval '6 days'),
  (21, 6, 43934, now() - interval '11 days'),
  (22, 6, 8553, now() - interval '14 days'),
  (23, 6, 2653, now() - interval '5 days'),
  (24, 6, 23117, now() - interval '15 days'),
  (25, 6, 25195, now() - interval '12 days'),
  (26, 7, 40710, now() - interval '89 days'),
  (27, 7, 41264, now() - interval '31 days'),
  (28, 7, 37932, now() - interval '39 days'),
  (29, 8, 1853, now() - interval '23 days'),
  (30, 8, 18119, now() - interval '14 days'),
  (31, 8, 38126, now() - interval '2 days');
