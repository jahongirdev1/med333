ALTER TABLE dispensing_items DROP CONSTRAINT IF EXISTS dispensing_items_record_id_fkey;
ALTER TABLE dispensing_items
  ADD CONSTRAINT dispensing_items_record_id_fkey
  FOREIGN KEY (record_id) REFERENCES dispensing_records(id) ON DELETE CASCADE;
