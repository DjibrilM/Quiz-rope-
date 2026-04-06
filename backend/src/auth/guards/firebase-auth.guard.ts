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

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    try {
      const token = authHeader.split('Bearer ')[1];
      const decoded = this.authService.verifyToken(token);
      
      if (decoded.role === 'parent') {
        const parent = await this.authService.getParentById(decoded.sub);
        if (!parent) return false;
        request.user = { ...parent.toObject(), role: 'parent' };
        return true;
      } else if (decoded.role === 'child') {
        // Find child if childId is in token
        const childId = decoded.childId || (decoded.sub && decoded.sub.length > 20 ? decoded.sub : null);
        if (childId) {
          const child = await this.authService.getChildById(childId);
          if (child) {
            // Verify the child actually belongs to the parent claimed in the token
            if (child.parentId?.toString() !== decoded.parentId) {
              return false;
            }
            request.user = {
              _id: child._id,
              parentId: decoded.parentId,
              role: 'child',
              displayName: child.displayName,
              avatarUrl: child.avatarUrl,
              grade: child.grade,
            };
            return true;
          }
        }
        // Fallback for session tokens without childId yet
        request.user = { _id: decoded.sub, parentId: decoded.parentId, role: 'child' };
        return true;
      }
      return false;
    } catch (error) {
      this.logger.error('Auth failed:', error.message);
      return false;
    }

  }
}
