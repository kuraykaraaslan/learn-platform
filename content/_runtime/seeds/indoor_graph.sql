-- Seed for lesson 489's indoor routing queries. One floor plate, in the shape
-- an IFC model gives you: spaces from the spatial structure, and edges from the
-- door relationships between them.
--
-- Two defects are in here on purpose, because both are ordinary and neither is
-- visible on a floor plan:
--
--   * `riser-01` has no edge at all — a space that exists in the model with no
--     door modelled against it. It is unreachable, and a router that assumes
--     connectivity answers "no route" without saying why.
--   * `plant-01` is reachable one way only. A self-closing door with no handle
--     on the inside is a DIRECTED edge, and almost every graph built from a
--     door list is built undirected.
--
-- Positions are metres in the model's own local system (Lesson 484), not a CRS.
DROP TABLE IF EXISTS space_edge;
DROP TABLE IF EXISTS space_node;

CREATE TABLE space_node (
  space_id text PRIMARY KEY,
  name     text NOT NULL,
  ifc_type text NOT NULL,
  usage    text NOT NULL,
  local_x  double precision NOT NULL,
  local_y  double precision NOT NULL
);

CREATE TABLE space_edge (
  from_space    text NOT NULL REFERENCES space_node (space_id),
  to_space      text NOT NULL REFERENCES space_node (space_id),
  -- What the model says connects them: a door, or an opening with no door.
  via           text NOT NULL,
  cost_m        double precision NOT NULL,
  -- False for a door that opens one way. The column exists because the default
  -- assumption is wrong for at least one door in every building.
  bidirectional boolean NOT NULL,
  PRIMARY KEY (from_space, to_space)
);

INSERT INTO space_node (space_id, name, ifc_type, usage, local_x, local_y) VALUES
  ('corr-01', 'Corridor 1', 'IfcSpace', 'circulation', 4.0, 2.0),
  ('corr-02', 'Corridor 2', 'IfcSpace', 'circulation', 8.0, 2.0),
  ('corr-03', 'Corridor 3', 'IfcSpace', 'circulation', 12.0, 2.0),
  ('corr-04', 'Corridor 4', 'IfcSpace', 'circulation', 16.0, 2.0),
  ('corr-05', 'Corridor 5', 'IfcSpace', 'circulation', 20.0, 2.0),
  ('corr-06', 'Corridor 6', 'IfcSpace', 'circulation', 24.0, 2.0),
  ('corr-07', 'Corridor 7', 'IfcSpace', 'circulation', 28.0, 2.0),
  ('corr-08', 'Corridor 8', 'IfcSpace', 'circulation', 32.0, 2.0),
  ('room-001', 'Room 001', 'IfcSpace', 'office', 4.0, 6.0),
  ('room-002', 'Room 002', 'IfcSpace', 'office', 4.0, 11.0),
  ('room-003', 'Room 003', 'IfcSpace', 'office', 4.0, -6.0),
  ('room-004', 'Room 004', 'IfcSpace', 'office', 4.0, -11.0),
  ('room-005', 'Room 005', 'IfcSpace', 'office', 8.0, 6.0),
  ('room-006', 'Room 006', 'IfcSpace', 'office', 8.0, 11.0),
  ('room-007', 'Room 007', 'IfcSpace', 'office', 8.0, -6.0),
  ('room-008', 'Room 008', 'IfcSpace', 'office', 8.0, -11.0),
  ('room-009', 'Room 009', 'IfcSpace', 'office', 12.0, 6.0),
  ('room-010', 'Room 010', 'IfcSpace', 'office', 12.0, 11.0),
  ('room-011', 'Room 011', 'IfcSpace', 'office', 12.0, -6.0),
  ('room-012', 'Room 012', 'IfcSpace', 'office', 12.0, -11.0),
  ('room-013', 'Room 013', 'IfcSpace', 'office', 16.0, 6.0),
  ('room-014', 'Room 014', 'IfcSpace', 'office', 16.0, 11.0),
  ('room-015', 'Room 015', 'IfcSpace', 'office', 16.0, -6.0),
  ('room-016', 'Room 016', 'IfcSpace', 'office', 16.0, -11.0),
  ('room-017', 'Room 017', 'IfcSpace', 'office', 20.0, 6.0),
  ('room-018', 'Room 018', 'IfcSpace', 'office', 20.0, 11.0),
  ('room-019', 'Room 019', 'IfcSpace', 'office', 20.0, -6.0),
  ('room-020', 'Room 020', 'IfcSpace', 'office', 20.0, -11.0),
  ('room-021', 'Room 021', 'IfcSpace', 'office', 24.0, 6.0),
  ('room-022', 'Room 022', 'IfcSpace', 'office', 24.0, 11.0),
  ('room-023', 'Room 023', 'IfcSpace', 'office', 24.0, -6.0),
  ('room-024', 'Room 024', 'IfcSpace', 'office', 24.0, -11.0),
  ('room-025', 'Room 025', 'IfcSpace', 'office', 28.0, 6.0),
  ('room-026', 'Room 026', 'IfcSpace', 'office', 28.0, 11.0),
  ('room-027', 'Room 027', 'IfcSpace', 'office', 28.0, -6.0),
  ('room-028', 'Room 028', 'IfcSpace', 'office', 28.0, -11.0),
  ('stair-01', 'Stair core', 'IfcSpace', 'circulation', 0.0, 2.0),
  ('lift-01', 'Lift lobby', 'IfcSpace', 'circulation', 36.0, 2.0),
  ('plant-01', 'Plant room', 'IfcSpace', 'plant', 40.0, 2.0),
  ('riser-01', 'Riser 3', 'IfcSpace', 'riser', 20.0, 9.0);

INSERT INTO space_edge (from_space, to_space, via, cost_m, bidirectional) VALUES
  ('corr-01', 'corr-02', 'opening', 4.0, true),
  ('corr-02', 'corr-03', 'opening', 4.0, true),
  ('corr-03', 'corr-04', 'opening', 4.0, true),
  ('corr-04', 'corr-05', 'opening', 4.0, true),
  ('corr-05', 'corr-06', 'opening', 4.0, true),
  ('corr-06', 'corr-07', 'opening', 4.0, true),
  ('corr-07', 'corr-08', 'opening', 4.0, true),
  ('corr-01', 'room-001', 'door', 6.0, true),
  ('room-001', 'room-002', 'door', 5.0, true),
  ('corr-01', 'room-003', 'door', 6.0, true),
  ('room-003', 'room-004', 'door', 5.0, true),
  ('corr-02', 'room-005', 'door', 6.0, true),
  ('room-005', 'room-006', 'door', 5.0, true),
  ('corr-02', 'room-007', 'door', 6.0, true),
  ('room-007', 'room-008', 'door', 5.0, true),
  ('corr-03', 'room-009', 'door', 6.0, true),
  ('room-009', 'room-010', 'door', 5.0, true),
  ('corr-03', 'room-011', 'door', 6.0, true),
  ('room-011', 'room-012', 'door', 5.0, true),
  ('corr-04', 'room-013', 'door', 6.0, true),
  ('room-013', 'room-014', 'door', 5.0, true),
  ('corr-04', 'room-015', 'door', 6.0, true),
  ('room-015', 'room-016', 'door', 5.0, true),
  ('corr-05', 'room-017', 'door', 6.0, true),
  ('room-017', 'room-018', 'door', 5.0, true),
  ('corr-05', 'room-019', 'door', 6.0, true),
  ('room-019', 'room-020', 'door', 5.0, true),
  ('corr-06', 'room-021', 'door', 6.0, true),
  ('room-021', 'room-022', 'door', 5.0, true),
  ('corr-06', 'room-023', 'door', 6.0, true),
  ('room-023', 'room-024', 'door', 5.0, true),
  ('corr-07', 'room-025', 'door', 6.0, true),
  ('room-025', 'room-026', 'door', 5.0, true),
  ('corr-07', 'room-027', 'door', 6.0, true),
  ('room-027', 'room-028', 'door', 5.0, true),
  ('stair-01', 'corr-01', 'door', 5.0, true),
  ('corr-08', 'lift-01', 'door', 5.0, true),
  ('lift-01', 'plant-01', 'door', 4.0, false);

CREATE INDEX space_edge_from ON space_edge (from_space);
CREATE INDEX space_edge_to ON space_edge (to_space);
ANALYZE space_node;
ANALYZE space_edge;
