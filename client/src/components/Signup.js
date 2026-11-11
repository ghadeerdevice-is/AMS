import { registerSchema, useUserStore, Button, LinkButton, Input, PasswordInput, PageContainer } from "./Shared.js";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, Plane, User } from "lucide-react";
import { toast } from "sonner";
function RegisterPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const register = useUserStore(s => s.register);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirm: '',
    terms: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const returnTo = params.get('returnTo');
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : null;
  const loginPath = safeReturnTo ? `/login?returnTo=${encodeURIComponent(safeReturnTo)}` : '/login';
  const set = patch => setForm(f => ({
    ...f,
    ...patch
  }));
  const submit = async e => {
    e.preventDefault();
    if (loading) return;
    const errs = {};
    const parsed = registerSchema.safeParse({
      fullName: form.fullName,
      email: form.email,
      password: form.password
    });
    if (!parsed.success) for (const issue of parsed.error.issues) errs[String(issue.path[0])] = issue.message;
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    if (!form.terms) errs.terms = 'Please accept the terms to continue.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const user = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password
      });
      toast.success(`Account created — welcome, ${user.fullName.split(' ')[0]}!`);
      navigate(safeReturnTo ?? '/');
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registration failed.'
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
            <h1 className="mt-3 text-[19px] font-bold">Create your account</h1>
            <p className="mt-1 text-[12.5px] text-muted">Create your profile. Passwords are not stored or sent.</p>
          </div>

          <form onSubmit={submit} className="space-y-3" noValidate>
            <Input label="Full name" name="fullName" maxLength={100} autoComplete="name" placeholder="Your full name" icon={<User className="h-4 w-4" />} value={form.fullName} onChange={e => set({
            fullName: e.target.value
          })} error={errors.fullName} />
            <Input label="Email" type="email" name="email" maxLength={254} spellCheck={false} autoComplete="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} value={form.email} onChange={e => set({
            email: e.target.value
          })} error={errors.email} />

            <PasswordInput label="Password" name="password" maxLength={128} autoComplete="new-password" placeholder="At least 15 characters" icon={<Lock className="h-4 w-4" />} value={form.password} onChange={e => set({
            password: e.target.value
          })} error={errors.password} />

            <PasswordInput label="Confirm password" name="confirm" maxLength={128} autoComplete="new-password" placeholder="Repeat your password" icon={<Lock className="h-4 w-4" />} value={form.confirm} onChange={e => set({
            confirm: e.target.value
          })} error={errors.confirm} />

            <div>
              {/* Negative margin cancels the padding: the label is a 44px touch
               target without moving anything else. */}
              <label className="-my-3 flex min-h-11 cursor-pointer items-center gap-2 py-3 text-[12.5px] text-secondary">
                <input type="checkbox" checked={form.terms} onChange={e => set({
                terms: e.target.checked
              })} className="h-4 w-4 shrink-0 rounded accent-primary" />
                I agree to store my account details and travel preferences.
              </label>
              {errors.terms && <p className="mt-1 text-[11.5px] text-danger">{errors.terms}</p>}
            </div>

            {errors.form && <p role="alert" className="tone-danger rounded-lg border px-3 py-2 text-[12px]">
                {errors.form}
              </p>}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign Up
            </Button>
          </form>

          <p className="mt-4 text-center text-[12.5px] text-secondary">
            Already have an account?{' '}
            <Link to={loginPath} className="font-semibold text-primary hover:underline">
              Log in
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
export { RegisterPage };
export default RegisterPage;
