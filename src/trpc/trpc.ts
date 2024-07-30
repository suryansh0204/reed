import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";

const t = initTRPC.create();
const isAuth = t.middleware(async (opts) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
// the user is not able to call this API Endpoint if they are not logged in
  if (!user || !user.id) throw new TRPCError({ code: "UNAUTHORIZED" });

  return opts.next({ //Whatever we pass in the middleware context is going to be accessible in the context from our API Endpoint
    ctx: {
      userId: user.id,
      user,
    },
  });
});

export const router = t.router;
export const procedure = t.procedure;
export const privateProcedure = t.procedure.use(isAuth); // this means when someone calls this procedure, it runs through this middleware beforehand
