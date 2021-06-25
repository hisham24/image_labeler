-- Add migration script here
CREATE TABLE images_metadata(
	id uuid NOT NULL,
	PRIMARY KEY (id),
	username TEXT NOT NULL,
	image_folder TEXT NOT NULL,
    UNIQUE (username, image_folder),
	upload_at timestamptz NOT NULL
);

CREATE TABLE images(
    id uuid NOT NULL,
    PRIMARY KEY (id),
    username TEXT NOT NULL,
	image_folder TEXT NOT NULL,
    image TEXT NOT NULL,
    upload_at timestamptz NOT NULL
);

CREATE TABLE image_labels(
     id uuid NOT NULL,
     PRIMARY KEY (id),
     username TEXT NOT NULL,
     image_folder TEXT NOT NULL,
     image TEXT NOT NULL,
     bbox TEXT NOT NULL,
     upload_at timestamptz NOT NULL
);