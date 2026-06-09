import { LoginForm } from './login-form';

export default async function () {
  return (
    <div className="max-w-md mx-auto col gap-4 my-12">
      <h1>Log in</h1>
      <LoginForm />
    </div>
  );
}
