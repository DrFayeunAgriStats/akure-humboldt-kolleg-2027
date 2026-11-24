alter table public.abstracts
  drop constraint if exists abstract_body_250_to_300_words,
  drop constraint if exists abstract_text_or_file,
  add constraint abstract_text_or_file check (
    case when body ~ '\S' then
      cardinality(regexp_split_to_array(regexp_replace(body, '^\s+|\s+$', '', 'g'), '\s+')) <= 300
    else
      file_path is not null
      and split_part(file_path, '/', 1) = user_id::text
      and split_part(file_path, '/', 2) ~ '\S'
    end
  );
