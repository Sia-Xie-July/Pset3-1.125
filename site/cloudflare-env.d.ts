declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    FINGRID_API_KEY?: string;
    BUCKET?: R2Bucket;
  }
}
