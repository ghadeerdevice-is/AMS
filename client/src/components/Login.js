import { loginSchema, useUserStore, Button, LinkButton, Input, PasswordInput, PageContainer } from "./Shared.js";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, Plane } from "lucide-react";
import { toast } from "sonner";
function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const login = useUserStore(s => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const returnTo = params.get('returnTo');
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
  const registerPath = safeReturnTo ? `/register?returnTo=${encodeURIComponent(safeReturnTo)}` : '/register';
  const submit = async e => {
    e.preventDefault();
    if (loading) return;
    const errs = {};
    const parsed = loginSchema.safeParse({
      email,
      password,
      remember
    });
    if (!parsed.success) for (const issue of parsed.error.issues) errs[issue.path[0]] = issue.message;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const user = await login(email, password, remember);
      toast.success(`Welcome back, ${user.fullName.split(' ')[0]}!`);
      navigate(safeReturnTo ?? '/');
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Login failed.'
      });
    } finally {
      setLoading(false);
    }
  };
  return <PageContainer className="py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="card p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-on-primary">
              <Plane className="h-5 w-5 -rotate-[35deg]" />
            </span>
            <h1 className="mt-3 text-[19px] font-bold">Welcome back</h1>
            <p className="mt-1 text-[12.5px] text-muted">
              Sign in to your SkyAssist profile.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3" noValidate>
            <Input label="Email" type="email" name="email" maxLength={254} spellCheck={false} autoComplete="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />

            <PasswordInput label="Password" name="password" maxLength={128} autoComplete="current-password" placeholder="••••••••" icon={<Lock className="h-4 w-4" />} value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />

            <div className="flex items-center justify-between text-[12.5px]">
              {/* Negative margin cancels the padding: the label gains a 44px
               touch target without moving the row. */}
              <label className="-my-3 flex min-h-11 cursor-pointer items-center gap-2 py-3 text-secondary">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 rounded accent-primary" />
                Remember session
              </label>
            </div>

            {errors.form && <p role="alert" className="tone-danger rounded-lg border px-3 py-2 text-[12px]">
                {errors.form}
              </p>}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Log In
            </Button>
          </form>

          <p className="mt-4 text-center text-[12.5px] text-secondary">
            No account yet?{' '}
            <Link to={registerPath} className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="mt-3 text-center">
          <LinkButton to="/" variant="ghost" size="sm">
            ← Back to home
          </LinkButton>
        </div>
      </div>
    </PageContainer>;
}
export { LoginPage };
export default LoginPage;
