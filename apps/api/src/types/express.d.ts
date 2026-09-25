import { Role } from "@repo/types";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role:   Role;
        email:  string;
      };
      auditLogged?: boolean;
      /** Raw form-encoded request body, captured by the urlencoded parser's
       *  `verify` hook — see server.ts. Only present on POST bodies parsed
       *  through that middleware (i.e. anything hitting the ITN route). */
      rawBody?: string;
    }
  }
}

export {};
