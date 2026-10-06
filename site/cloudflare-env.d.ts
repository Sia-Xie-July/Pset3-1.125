declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    FINGRID_API_KEY?: string;
    OPENAI_API_KEY?: string;
    INITIAL_ADMIN_IDENTITY?: string;
    BUCKET?: R2Bucket;
  }
}
