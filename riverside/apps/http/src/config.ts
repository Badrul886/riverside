import dotenv from "dotenv";
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const JWT_SECRET =
  "20d9a6e5dc282cdc1167659bc7563ee3f91c5af1391e722db9d89755153592c2";
export const JWT_ACCESS_SECRET =
  "1474da9ee24001254259506f61e967a0df317cf8c554ae7bfcd1f43b18eab41e";
export const JWT_REFRESH_SECRET =
  "bc763b5dbefb0dcd63f9a9e799d2796cf2a00789e28281298f1bed13d879ac51";

  // config.js
const validDomains = ['.yourdomain.com', 'localhost', '.staging.yourdomain.com'];
export const cookieDomain = validDomains.includes(process.env.COOKIE_DOMAIN ?? "")
  ? (process.env.COOKIE_DOMAIN ?? "localhost")
  : "localhost";


// module.exports = {
  // cookieDomain: validDomains.includes(process.env.COOKIE_DOMAIN ?? "")
  //   ? (process.env.COOKIE_DOMAIN ?? "localhost")
  //   : "localhost",
//   JWT_SECRET:
//     "20d9a6e5dc282cdc1167659bc7563ee3f91c5af1391e722db9d89755153592c2",
//   JWT_ACCESS_SECRET:
//     "1474da9ee24001254259506f61e967a0df317cf8c554ae7bfcd1f43b18eab41e",
//   JWT_REFRESH_SECRET:
//     "bc763b5dbefb0dcd63f9a9e799d2796cf2a00789e28281298f1bed13d879ac51",
// };
