import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/root.tsx";
import { sessionRoute } from "./routes/session.tsx";
import { timetableRoute } from "./routes/timetable.tsx";

const routeTree = rootRoute.addChildren([timetableRoute, sessionRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
