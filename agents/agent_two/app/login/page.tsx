import { LoginButton } from '../../components/LoginButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AI Chat Agent</CardTitle>
          <CardDescription>
            Sign in to access your personal AI assistant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginButton />
        </CardContent>
      </Card>
    </div>
  );
}
