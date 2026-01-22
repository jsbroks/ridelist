import { ArrowRight } from "lucide-react";

interface Route {
  from: string;
  to: string;
  price: string;
  time: string;
}

interface Province {
  id: string;
  name: string;
  routes: Route[];
}

const provinces: Province[] = [
  {
    id: "ontario",
    name: "Ontario",
    routes: [
      { from: "Toronto", to: "Ottawa", price: "$40", time: "4.5h" },
      { from: "Toronto", to: "London", price: "$25", time: "2h" },
      { from: "Ottawa", to: "Kingston", price: "$20", time: "2h" },
      { from: "Toronto", to: "Hamilton", price: "$15", time: "1h" },
      { from: "Toronto", to: "Waterloo", price: "$20", time: "1.5h" },
      { from: "Ottawa", to: "Toronto", price: "$40", time: "4.5h" },
    ],
  },
  {
    id: "quebec",
    name: "Quebec",
    routes: [
      { from: "Montreal", to: "Quebec City", price: "$35", time: "3h" },
      { from: "Montreal", to: "Sherbrooke", price: "$20", time: "1.5h" },
      { from: "Montreal", to: "Trois-Rivières", price: "$25", time: "1.5h" },
      { from: "Quebec City", to: "Saguenay", price: "$30", time: "2.5h" },
      { from: "Montreal", to: "Gatineau", price: "$25", time: "2h" },
      { from: "Sherbrooke", to: "Montreal", price: "$20", time: "1.5h" },
    ],
  },
  {
    id: "bc",
    name: "British Columbia",
    routes: [
      { from: "Vancouver", to: "Victoria", price: "$45", time: "3.5h" },
      { from: "Vancouver", to: "Whistler", price: "$30", time: "2h" },
      { from: "Vancouver", to: "Kelowna", price: "$50", time: "4h" },
      { from: "Vancouver", to: "Kamloops", price: "$45", time: "3.5h" },
      { from: "Kelowna", to: "Vernon", price: "$15", time: "45m" },
      { from: "Victoria", to: "Nanaimo", price: "$25", time: "1.5h" },
    ],
  },
  {
    id: "alberta",
    name: "Alberta",
    routes: [
      { from: "Calgary", to: "Edmonton", price: "$35", time: "3h" },
      { from: "Calgary", to: "Banff", price: "$20", time: "1.5h" },
      { from: "Edmonton", to: "Red Deer", price: "$20", time: "1.5h" },
      { from: "Calgary", to: "Lethbridge", price: "$30", time: "2.5h" },
      { from: "Edmonton", to: "Fort McMurray", price: "$55", time: "4.5h" },
      { from: "Calgary", to: "Red Deer", price: "$25", time: "1.5h" },
    ],
  },
];

// Different wavy underline paths for variety
const underlinePaths = [
  "M2 6 Q20 2, 40 6 T80 6 T120 6",
  "M2 4 Q30 8, 60 4 T120 4",
  "M2 6 Q15 2, 30 6 T60 6 T90 6 T120 6",
  "M2 5 Q35 8, 70 5 T120 5",
];

export function PopularRoutes() {
  return (
    <section className="relative py-20">
      <div className="container">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Popular Routes
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl">
            Discover the most traveled routes across Canada. New rides are
            posted every day.
          </p>
        </div>

        {/* 2x2 Province Grid */}
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2">
          {provinces.map((province, provinceIndex) => (
            <div key={province.id}>
              {/* Province Header with wavy underline */}
              <div className="mb-6">
                <h3 className="relative inline-block text-2xl font-bold">
                  {province.name}
                  <svg
                    className="absolute -bottom-2 left-0 h-3 w-full"
                    viewBox="0 0 120 10"
                    fill="none"
                    preserveAspectRatio="none"
                    style={{ strokeWidth: "2.5px" }}
                  >
                    <path
                      d={underlinePaths[provinceIndex % underlinePaths.length]}
                      stroke="currentColor"
                      strokeLinecap="round"
                      className="text-primary/40"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </h3>
              </div>

              {/* Routes Grid 2x3 */}
              <div className="grid grid-cols-2 gap-4">
                {province.routes.map((route, index) => (
                  <button
                    key={`${province.id}-${route.from}-${route.to}-${index}`}
                    className="group py-1 text-left transition-colors hover:opacity-70"
                  >
                    <div className="flex items-center gap-2">
                      <ArrowRight className="text-primary size-4 shrink-0" />
                      <span className="truncate">
                        {route.from} → {route.to}
                      </span>
                    </div>
                    <div className="text-muted-foreground ml-6 text-sm">
                      {route.time} ·{" "}
                      <span className="text-primary font-medium">
                        {route.price}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* View All Link */}
              <div className="mt-4">
                <button className="text-primary hover:text-primary/80 text-sm font-medium">
                  View all routes →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
