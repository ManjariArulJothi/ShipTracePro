
import { useState } from "react";
import { useRoutes } from "@/lib/hooks";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { MapView } from "@/components/shared/map-view";
import { LoadingState } from "@/components/shared/states";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";



import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Route, MapPinned, Map, Navigation, ArrowDownUp, Sparkles, Fuel, Zap, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useHubs, useFindRoute, useOptimizeRoute } from "@/lib/hooks";


export function RouteManagementPage() {
 


  const { data: hubs, isLoading } = useHubs();
 

  const [originHubId, setOriginHubId] = useState("");
  const [destinationHubId, setDestinationHubId] = useState("");

  
  const [request, setRequest] = useState(null);

  const { data: route } = useFindRoute(
    request?.originHubId,
    request?.destinationHubId,
  );

  const optimizeRoute = useOptimizeRoute();
  const [mlOptimization, setMlOptimization] = useState(null);

  const handleRunOptimization = async () => {
    if (!route?.route || route.route.length < 2) return;
    const origin = {
      name: route.route[0].hubName,
      lat: route.route[0].latitude,
      lng: route.route[0].longitude,
    };
    const destination = {
      name: route.route[route.route.length - 1].hubName,
      lat: route.route[route.route.length - 1].latitude,
      lng: route.route[route.route.length - 1].longitude,
    };
    const intermediates = route.route.slice(1, -1).map((h) => ({
      name: h.hubName,
      lat: h.latitude,
      lng: h.longitude,
    }));

    try {
      const result = await optimizeRoute.mutateAsync({
        origin,
        destination,
        intermediate_stops: intermediates,
      });
      setMlOptimization(result);
    } catch (err) {
      console.warn("ML Route Optimization failed:", err);
    }
  };

const selectedPoints =
  route?.route?.map((hub) => ({
    lat: hub.latitude,
    lng: hub.longitude,
    name: hub.hubName,
    status: "active",
  })) ?? [];

const selectedRoute =
  route?.route?.map((hub) => ({
    lat: hub.latitude,
    lng: hub.longitude,
  })) ?? [];

const totalRoutes = route ? 1 : 0;

const totalDistance = route?.totalDistanceKm ?? 0;

const totalHubs = route?.totalHubs ?? 0;

const eta = route ? `${route.estimatedHours}h ${route.estimatedMinutes}m` : "-";


   if (isLoading) {
     return (
       <div>
         <PageHeader
           title="Route Management"
           description="Plan, optimize & monitor delivery routes"
           icon={Route}
         />
         <LoadingState />
       </div>
     );
   }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Route Management"
        description="Plan, optimize & monitor delivery routes"
        icon={Route}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Route Found"
          value={totalRoutes}
          icon={Route}
          iconClass="bg-primary/10 text-primary"
        />

        <StatCard
          label="Total Distance"
          value={`${totalDistance} km`}
          icon={Navigation}
          iconClass="bg-success/10 text-success"
        />

        <StatCard
          label="Total Hubs"
          value={totalHubs}
          icon={MapPinned}
          iconClass="bg-chart-3/10 text-chart-3"
        />

        <StatCard
          label="Estimated Time"
          value={eta}
          icon={Map}
          iconClass="bg-warning/10 text-warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        <Card className="lg:col-span-2 overflow-hidden p-0">
          <div className="border-b border-border p-4 space-y-4">
            <div>
              <CardTitle className="text-sm">Route Finder</CardTitle>

              <CardDescription className="text-xs">
                Select origin and destination hub
              </CardDescription>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={originHubId} onValueChange={setOriginHubId}>
                <SelectTrigger>
                  <SelectValue placeholder="Origin Hub" />
                </SelectTrigger>

                <SelectContent className="z-[9999]">
                  {hubs?.map((hub) => (
                    <SelectItem key={hub.id} value={String(hub.id)}>
                      {hub.hubName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={destinationHubId}
                onValueChange={setDestinationHubId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Destination Hub" />
                </SelectTrigger>

                <SelectContent className="z-[9999]">
                  {hubs?.map((hub) => (
                    <SelectItem key={hub.id} value={String(hub.id)}>
                      {hub.hubName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() =>
                  setRequest({
                    originHubId,
                    destinationHubId,
                  })
                }
                disabled={!originHubId || !destinationHubId}
              >
                Show Route
              </Button>
            </div>
          </div>
          <div className="h-[420px]">
            <MapView
              points={selectedPoints}
              route={selectedRoute}
              zoom={route ? 5 : 4}
              className="!rounded-none h-[420px]"
            />
          </div>
        </Card>
        {/*================================================================*/}
        <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin">
          {route && (
            <Card>
              <CardContent className="p-5">
                <CardTitle className="mb-6">Route Details</CardTitle>

                <div className="w-full overflow-x-auto">
                  <div className="flex min-w-max items-start px-6 pb-8">
                    {route?.route?.map((hub, index) => {
                      const isLast = index === route.route.length - 1;

                      return (
                        <div key={hub.hubId} className="flex">
                          {/* Current city */}
                          <div className="relative w-0">
                            {/* City name */}
                            <div className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-sm font-medium text-muted-foreground">
                              {hub.city}
                            </div>

                            {/* Dot */}
                            <div className="absolute left-1/2 top-9 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-primary bg-background" />
                          </div>

                          {/* Connection to next city */}
                          {!isLast && (
                            <div className="relative h-20 w-64">
                              {/* Continuous line */}
                              <div className="absolute left-0 right-0 top-[42px] h-0.5 bg-primary" />

                              {/* Distance */}
                              <div className="absolute left-1/2 top-[50px] -translate-x-1/2 whitespace-nowrap text-xs font-medium text-primary">
                                {hub.distanceToNextKm} km
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ML Route Optimization Section */}
                <div className="mt-6 pt-5 border-t border-border/60 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Model 4: AI & ML Route Optimization
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Solves Multi-Stop Traveling Salesperson heuristic for minimum fuel & transit time
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="brand"
                      onClick={handleRunOptimization}
                      disabled={optimizeRoute.isPending}
                      className="text-xs font-bold"
                    >
                      <Zap className="mr-1.5 h-3.5 w-3.5" />
                      {optimizeRoute.isPending ? "Optimizing..." : "Run ML Optimizer"}
                    </Button>
                  </div>

                  {mlOptimization && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Optimization Results</span>
                        <Badge className="bg-emerald-500 text-white font-bold">
                          +{mlOptimization.optimization_gain_pct}% Efficiency Gain
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className="rounded-lg bg-card p-2.5 border border-border/70 text-center">
                          <p className="text-[10px] text-muted-foreground">Original Distance</p>
                          <p className="text-sm font-bold text-foreground">{mlOptimization.original_distance_km} km</p>
                        </div>
                        <div className="rounded-lg bg-card p-2.5 border border-border/70 text-center">
                          <p className="text-[10px] text-muted-foreground">Optimized Distance</p>
                          <p className="text-sm font-bold text-emerald-600">{mlOptimization.optimized_distance_km} km</p>
                        </div>
                        <div className="rounded-lg bg-card p-2.5 border border-border/70 text-center">
                          <p className="text-[10px] text-muted-foreground">Fuel Saved</p>
                          <p className="text-sm font-bold text-primary flex items-center justify-center gap-1">
                            <Fuel className="h-3.5 w-3.5" /> {mlOptimization.fuel_saved_liters} L
                          </p>
                        </div>
                        <div className="rounded-lg bg-card p-2.5 border border-border/70 text-center">
                          <p className="text-[10px] text-muted-foreground">Time Saved</p>
                          <p className="text-sm font-bold text-foreground">{mlOptimization.time_saved_minutes} mins</p>
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground pt-1">
                        <span className="font-semibold text-foreground">Recommended Stop Sequence: </span>
                        {mlOptimization.optimized_waypoints?.map((wp) => wp.name).join(" ➔ ")}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        
      </div>
    </div>
  );
}