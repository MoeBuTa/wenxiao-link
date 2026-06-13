import { getSiteContent } from "./lib/content";
import { HomeClient } from "./components/HomeClient";

export const revalidate = 30;

export default async function HomePage() {
  const { profile, news } = await getSiteContent();
  return <HomeClient profile={profile} news={news} />;
}
