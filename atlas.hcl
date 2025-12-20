variable "database_url" {
  type    = string
  default = getenv("DATABASE_URL")
}

variable "database_auth_token" {
  type    = string
  default = getenv("DATABASE_AUTH_TOKEN")
}

env "local" {
  src = "file://db/schema.sql"
  url = "sqlite://data/local.db"
  dev = "sqlite://file?mode=memory"
  migration {
    dir = "file://db/migrations"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}

env "turso" {
  src     = "file://db/schema.sql"
  url     = "${var.database_url}?authToken=${var.database_auth_token}"
  dev     = "sqlite://file?mode=memory"
  exclude = ["_litestream*"]
  migration {
    dir = "file://db/migrations"
  }
}
