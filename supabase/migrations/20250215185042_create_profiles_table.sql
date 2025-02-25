CREATE TYPE user_role AS ENUM ('admin', 'agent', 'user');

create table profiles (
  id uuid references auth.users(id) primary key,
  full_name text not null,
  age integer,
  role user_role DEFAULT 'user',
);
