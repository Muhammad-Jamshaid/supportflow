import { encode } from "next-auth/jwt";

async function main() {
  const tokenUser = await encode({
    token: {
      id: "cmrz0los80005mk23zucyhp7l",
      email: "devsinc@gmail.com",
      name: "Ahmad",
      role: "ADMIN",
      companyId: "cmrz0loak0003mk23ihpb9ct1",
      isPlatformOwner: false
    },
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  const tokenAdmin = await encode({
    token: {
      id: "admin-id",
      email: "admin@platform.com",
      name: "Platform Admin",
      role: "ADMIN",
      companyId: "admin-company-id",
      isPlatformOwner: true
    },
    secret: process.env.NEXTAUTH_SECRET as string,
  });

  console.log("USER_COOKIE=" + tokenUser);
  console.log("ADMIN_COOKIE=" + tokenAdmin);
}
main();
