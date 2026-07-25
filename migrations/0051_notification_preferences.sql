ALTER TABLE user_preferences ADD COLUMN notification_preferences TEXT
    DEFAULT '{"email":true,"push":false,"reports":true}';
