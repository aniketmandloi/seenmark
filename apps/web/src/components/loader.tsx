export default function Loader() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="mx-auto grid min-h-[24rem] max-w-3xl content-center gap-5 px-6 py-12"
    >
      <div className="h-8 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      <div className="h-12 w-full max-w-md animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-muted motion-reduce:animate-none" />
      <span className="sr-only">Loading your account</span>
    </div>
  );
}
