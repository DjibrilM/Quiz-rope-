import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!this.authService.isFirebaseReady()) {
      // Dev mode: if a backend JWT is provided, verify it; otherwise use mock user
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split('Bearer ')[1];
          const decoded = this.authService.verifyToken(token);
          const parent = await this.authService.getParentById(decoded.sub);
          if (parent) {
            request.user = parent;
            return true;
          }
        } catch {
          // Fall through to mock user
        }
      }

      this.logger.debug('Using mock user');
      const mockUser = this.authService.getMockUser();
      // Use findOrCreateParent but this will only create once, then find thereafter
      const parent = await this.authService.findOrCreateParent({
        email: mockUser.email,
        displayName: mockUser.name,
        firebaseUid: mockUser.uid,
      });
      request.user = parent;
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = this.authService.verifyToken(token);
      const parent = await this.authService.getParentById(decoded.sub);
      if (!parent) {
        return false;
      }
      request.user = parent;
      return true;
    } catch (error) {
      this.logger.error('Auth failed:', error.message);
      return false;
    }
  }
}
