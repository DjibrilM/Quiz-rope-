import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class GhostAuthGuard implements CanActivate {
  private readonly logger = new Logger(GhostAuthGuard.name);

  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = this.authService.verifyToken(token);
      if (decoded.role !== 'ghost' || !decoded.guestId) {
        return false;
      }
      request.ghost = { guestId: decoded.guestId };
      return true;
    } catch (error) {
      this.logger.error('Ghost auth failed:', error.message);
      return false;
    }
  }
}
