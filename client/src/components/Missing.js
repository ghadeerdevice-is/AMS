import { Compass, ShieldAlert } from "lucide-react";
import { PageContainer, LinkButton } from "./Shared.js";
function NotFoundPage() {
  return <PageContainer className="py-14">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-primary">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-4 text-[42px] font-extrabold leading-none text-primary">404</p>
        <h1 className="mt-2 text-[18px] font-semibold">Page not found</h1>
        <p className="mt-2 text-[13px] text-muted">
          The page you're looking for doesn't exist — it may have moved or the link is broken.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <LinkButton to="/">Back to home</LinkButton>
          <LinkButton to="/flights" variant="outline">
            Browse flights
          </LinkButton>
        </div>
      </div>
    </PageContainer>;
}
function UnauthorizedPage() {
  return <PageContainer className="py-14">
      <div className="mx-auto max-w-md text-center">
        <div className="tone-danger mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <p className="mt-4 text-[36px] font-extrabold leading-none text-danger">401</p>
        <h1 className="mt-2 text-[18px] font-semibold">Sign in required</h1>
        <p className="mt-2 text-[13px] text-muted">
          This area is reserved for signed-in accounts. Log in or create an account to continue.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <LinkButton to="/login">Log in</LinkButton>
          <LinkButton to="/register" variant="outline">
            Create account
          </LinkButton>
        </div>
      </div>
    </PageContainer>;
}
export { NotFoundPage, UnauthorizedPage };
export default NotFoundPage;
