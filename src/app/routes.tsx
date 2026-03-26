import { createBrowserRouter } from "react-router";
import { RootLayout } from "./layouts/root-layout";
import { HomePage } from "./pages/home-page";
import { SportPage } from "./pages/sport-page";
import { MyBetsPage } from "./pages/my-bets-page";
import { StreamPage } from "./pages/stream-page";
import { MarketDetailPage } from "./pages/market-detail-page";
import { LivePage } from "./pages/live-page";
import { TrendingPage } from "./pages/trending-page";
import { AuthPage } from "./pages/auth-page";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "category/:categoryId", Component: SportPage },
      { path: "market/:marketId", Component: MarketDetailPage },
      { path: "my-positions", Component: MyBetsPage },
      { path: "live", Component: LivePage },
      { path: "trending", Component: TrendingPage },
      { path: "stream/:eventId", Component: StreamPage },
      { path: "signin", Component: AuthPage },
      { path: "signup", Component: AuthPage },
    ],
  },
]);
