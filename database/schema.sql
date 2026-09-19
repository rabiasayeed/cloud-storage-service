CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS folders_owner_parent_name_unique
ON folders(owner_id, parent_id, name)
WHERE is_deleted = FALSE;
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mime_type TEXT,
    size_bytes BIGINT,
    storage_key TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
    version_id UUID,
    checksum TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS files_owner_id_idx
ON files(owner_id);

CREATE INDEX IF NOT EXISTS files_name_trgm_idx
ON files USING GIN (name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    storage_key TEXT NOT NULL,
    size_bytes BIGINT,
    checksum TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL
        CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    grantee_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL
        CHECK (role IN ('viewer', 'editor')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(resource_type, resource_id, grantee_user_id)
);
CREATE TABLE IF NOT EXISTS link_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL
        CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'viewer'
        CHECK (role = 'viewer'),
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS stars (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL
        CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,

    PRIMARY KEY (user_id, resource_type, resource_id)
);
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL
        CHECK (
            action IN (
                'upload',
                'rename',
                'delete',
                'restore',
                'move',
                'share',
                'download'
            )
        ),
    resource_type TEXT NOT NULL
        CHECK (resource_type IN ('file', 'folder')),
    resource_id UUID NOT NULL,
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE files ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading','ready','failed'));
ALTER TABLE folders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE files ADD COLUMN IF NOT EXISTS preview_key TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS version_id UUID;
CREATE INDEX IF NOT EXISTS files_owner_folder_idx ON files(owner_id, folder_id, is_deleted, updated_at DESC);
CREATE INDEX IF NOT EXISTS files_deleted_idx ON files(owner_id, is_deleted, deleted_at DESC);
CREATE INDEX IF NOT EXISTS folders_owner_parent_idx ON folders(owner_id, parent_id, is_deleted, name);
CREATE INDEX IF NOT EXISTS shares_grantee_idx ON shares(grantee_user_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS link_shares_token_idx ON link_shares(token);
CREATE INDEX IF NOT EXISTS activities_resource_idx ON activities(resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS file_versions_file_idx ON file_versions(file_id, version_number DESC);
CREATE INDEX IF NOT EXISTS files_retention_idx ON files(is_deleted, deleted_at);


