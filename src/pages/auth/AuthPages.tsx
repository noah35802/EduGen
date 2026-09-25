import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GraduationCap, Shield, UserRound } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Label, Select } from "../../components/ui/Input";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginDemo, loginWithEmail } from "../../store/slices/authSlice";
import { Role } from "../../types";

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-3 font-bold"><span className="grid h-10 w-10 place-items-center rounded-md bg-brand-600">E</span>EduGen AI</Link>
        <div>
          <h1 className="text-4xl font-bold tracking-normal">Personalized learning powered by Artificial Intelligence.</h1>
          <p className="mt-4 text-slate-300">AI tutoring, analytics, study planning and role-based learning management in one polished demo.</p>
        </div>
      </aside>
      <main className="flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </Card>
      </main>
    </div>
  );
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.status === "loading");
  const [email, setEmail] = useState("student@edugen.ai");
  const [toast, setToast] = useState("");

  if (user) return <Navigate to={`/${user.role}/dashboard`} replace />;

  async function login(event: FormEvent) {
    event.preventDefault();
    const action = await dispatch(loginWithEmail(email));
    if (loginWithEmail.fulfilled.match(action)) navigate(`/${action.payload.role}/dashboard`);
  }

  async function demo(role: Role) {
    const action = await dispatch(loginDemo(role));
    if (loginDemo.fulfilled.match(action)) {
      setToast(`Continuing as ${role}`);
      navigate(`/${role}/dashboard`);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your EduGen AI workspace.">
      <form className="mt-6 space-y-4" onSubmit={login}>
        <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div><Label htmlFor="password">Password</Label><Input id="password" type="password" defaultValue="password123" /></div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" className="h-4 w-4 rounded" /> Remember me</label>
          <Link to="/forgot-password" className="text-brand-600">Forgot password?</Link>
        </div>
        <Button className="w-full" disabled={loading}>{loading ? "Signing in..." : "Login"}</Button>
      </form>
      <div className="mt-5 grid gap-2">
        <Button variant="secondary" onClick={() => demo("student")}><UserRound size={18} /> Continue as Student</Button>
        <Button variant="secondary" onClick={() => demo("teacher")}><GraduationCap size={18} /> Continue as Teacher</Button>
        <Button variant="secondary" onClick={() => demo("admin")}><Shield size={18} /> Continue as Admin</Button>
      </div>
      {toast && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{toast}</p>}
      <p className="mt-5 text-center text-sm text-slate-500">New here? <Link className="text-brand-600" to="/register">Create an account</Link></p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [created, setCreated] = useState(false);
  return (
    <AuthShell title="Create account" subtitle="Set up a role-based EduGen AI demo profile.">
      <form className="mt-6 space-y-4">
        <div><Label>Full name</Label><Input placeholder="Radhika Singhania" /></div>
        <div><Label>Email</Label><Input type="email" placeholder="you@edugen.ai" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Password</Label><Input type="password" /></div>
          <div><Label>Confirm password</Label><Input type="password" /></div>
        </div>
        <div><Label>Role</Label><Select><option>Student</option><option>Teacher</option><option>Admin</option></Select></div>
        <Button type="button" className="w-full" onClick={() => setCreated(true)}>Register</Button>
      </form>
      {created && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Account created for demo. You can now sign in with the selected role.</p>}
      <p className="mt-5 text-center text-sm text-slate-500">Already have an account? <Link className="text-brand-600" to="/login">Login</Link></p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title="Reset password" subtitle="Enter your email and receive a secure reset link.">
      <form className="mt-6 space-y-4">
        <div><Label>Email</Label><Input type="email" placeholder="student@edugen.ai" /></div>
        <Button type="button" className="w-full" onClick={() => setSent(true)}>Send reset link</Button>
      </form>
      {sent && <p className="mt-3 rounded-md bg-sky-50 p-3 text-sm text-sky-700">Reset instructions sent to your demo inbox.</p>}
      <p className="mt-5 text-center text-sm"><Link className="text-brand-600" to="/login">Back to login</Link></p>
    </AuthShell>
  );
}
