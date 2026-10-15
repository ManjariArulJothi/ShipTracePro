

import { useParams, Link, useNavigate } from "react-router-dom";
import { useShipment, useMlEta, useMlFailureRisk } from "@/lib/hooks";
import { MapView } from "@/components/shared/map-view";
import { TrackingTimeline } from "@/components/shared/tracking-timeline";
import { StatusBadge, PriorityBadge } from "@/components/shared/status-badge";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { useQuery } from "@tanstack/react-query";
import { shipmentsApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  relativeDay,
} from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  MapPin,
  Weight,
  Boxes,
  Truck,
  Plane,
  Ship,
  Train,
  Building2,
  Calendar,
  DollarSign,
  Navigation,
  Printer,
  Share2,
  CircleX,
  Sparkles,
  Cpu,
  ShieldAlert,
} from "lucide-react";

const modeIcon = {
  road: Truck,
  air: Plane,
  ocean: Ship,
  rail: Train,
  multimodal: Truck,
};







export function ShipmentDetailPage() {
  const { id } = useParams();
  const { data: shipment, isLoading } = useShipment(id);
  const tracking = useQuery({
    queryKey: ["shipment-tracking", id],
    queryFn: () => shipmentsApi.getTracking(id),
    enabled: !!id,
    refetchInterval: 5000,
  });

  // const tracking = useQuery({
  //   queryKey: ["shipment-tracking", id],
  //   queryFn: () => shipmentsApi.getTracking(id),
  // });

  const trackingData = tracking.data;
  const navigate = useNavigate();

  const mlEta = useMlEta({
    distance_km: trackingData?.remainingDistanceKm || 50,
    package_weight_kg: shipment?.packageWeightKg || 2.5,
    traffic_condition: trackingData?.trafficCondition || "LOW",
    weather_condition: trackingData?.weatherCondition || "CLEAR",
    road_condition: trackingData?.roadCondition || "GOOD",
    hubs_count: trackingData?.trackingHistory?.length || 2,
  });

  const mlRisk = useMlFailureRisk({
    delay_minutes: mlEta.data?.predicted_delay_minutes || 0,
    traffic_condition: trackingData?.trafficCondition || "LOW",
    weather_condition: trackingData?.weatherCondition || "CLEAR",
    road_condition: trackingData?.roadCondition || "GOOD",
    hours_in_transit: 6.0,
    package_weight_kg: shipment?.packageWeightKg || 2.5,
  });

  if (isLoading || tracking.isLoading) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <LoadingState label="Loading shipment…" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <EmptyState
          icon={Package}
          title="Shipment not found"
          description="This shipment may have been removed or the link is invalid."
          action={
            <Button asChild>
              <Link to="/app/shipments">View all shipments</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // const ModeIcon = modeIcon[shipment.mode];
  const ModeIcon = Truck;
const isCustomerCancelled = shipment.cancelledByCustomer === true;
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="mt-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-xl font-bold tracking-tight">
                {shipment.trackingNumber}
              </h1>
              <StatusBadge status={shipment.status} />
              <PriorityBadge priority={shipment.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              {shipment.senderCity} → {shipment.receiverCity} ·{" "}
              {shipment.carrier}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Map */}
          <Card className="overflow-hidden">
            <div className="relative h-[700px]">
              {/* =================================================== */}
              {/* <MapView
                shipment={shipment}
                className="!rounded-none h-[380px]"
              /> */}
              <MapView
                tracking={trackingData}
                className="!rounded-none h-[700px]"
              />
              {/* ====================================================== */}
            </div>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="font-semibold text-primary">
                  {trackingData?.progressPercentage ?? 0}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full gradient-brand transition-all"
                  style={{
                    width: `${trackingData?.progressPercentage ?? 0}%`,
                  }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {/* <MapPin className="h-3 w-3" /> {shipment.currentLocation.name} */}
                </span>
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" /> {shipment.receiverCity}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tracking History */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking History</CardTitle>
              <CardDescription>Chronological shipment events</CardDescription>
            </CardHeader>
            <CardContent>
              <TrackingTimeline events={trackingData?.trackingHistory ?? []} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Shipment Details */}

        

          {isCustomerCancelled ? (
            <Card className="border-destructive/30">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <CircleX className="h-5 w-5" />
                  </span>

                  <div>
                    <CardTitle className="text-destructive">
                      Shipment Cancelled
                    </CardTitle>

                    <CardDescription className="mt-1">
                      This parcel was cancelled by the customer.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cancellation Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
                    {shipment.cancellationReason ||
                      "No cancellation reason was provided."}
                  </p>
                </div>

                {shipment.cancelledAt && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Cancelled on {formatDateTime(shipment.cancelledAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Prediction</CardTitle>
                <CardDescription>
                  Live ETA and delivery forecast
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <DetailRow
                  icon={Navigation}
                  label="Remaining Distance"
                  value={`${trackingData?.remainingDistanceKm ?? 0} km`}
                />

                <DetailRow
                  icon={Truck}
                  label="Estimated Travel Time"
                  value={`${trackingData?.estimatedHours ?? 0} hrs ${
                    trackingData?.estimatedMinutes ?? 0
                  } mins`}
                />

                <DetailRow
                  icon={Calendar}
                  label="Estimated Arrival"
                  value={formatDateTime(trackingData?.estimatedArrival)}
                />

                <DetailRow
                  icon={Package}
                  label="Forecast"
                  value={trackingData?.deliveryForecast?.forecastStatus}
                />

                <DetailRow
                  icon={Package}
                  label="Confidence"
                  value={`${trackingData?.deliveryForecast?.confidencePercentage}%`}
                />

                <DetailRow
                  icon={Package}
                  label="Reason"
                  value={trackingData?.deliveryForecast?.reason}
                />
              </CardContent>
            </Card>
          )}

          {/* AI / ML Insights Card */}
          <Card className="border-primary/40 shadow-sm bg-gradient-to-b from-card to-primary/[0.02]">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  AI & Machine Learning Insights
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-primary/10 text-primary border-primary/20">
                  ML Engine Active
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Real-time predictive telemetry & risk assessment
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4 text-xs">
              {/* Model 1: ETA & Delay Risk */}
              <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-primary" /> Model 1: ETA Delay Risk
                  </span>
                  <Badge
                    className={
                      mlEta.data?.risk_level === "HIGH"
                        ? "bg-rose-500 text-white"
                        : mlEta.data?.risk_level === "MEDIUM"
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-500 text-white"
                    }
                  >
                    {mlEta.data?.risk_level || "LOW"} RISK
                  </Badge>
                </div>

                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Predicted Delay:</span>
                  <span className="font-bold text-foreground">
                    +{mlEta.data?.predicted_delay_minutes || 0} mins
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Delay Probability:</span>
                  <span className="font-bold text-foreground">
                    {Math.round((mlEta.data?.delay_risk_probability || 0.15) * 100)}%
                  </span>
                </div>

                {mlEta.data?.contributing_factors?.length > 0 && (
                  <div className="pt-1.5 border-t border-border/40">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1">
                      Factors Analyzed:
                    </p>
                    <ul className="list-disc pl-3.5 space-y-0.5 text-[11px] text-muted-foreground/90">
                      {mlEta.data.contributing_factors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Model 5: Delivery Failure & Churn Risk */}
              <div className="space-y-2 rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-chart-6" /> Model 5: Failure Risk
                  </span>
                  <Badge
                    className={
                      mlRisk.data?.risk_category === "CRITICAL"
                        ? "bg-rose-500 text-white"
                        : mlRisk.data?.risk_category === "MODERATE"
                          ? "bg-amber-500 text-white"
                          : "bg-emerald-500 text-white"
                    }
                  >
                    {mlRisk.data?.risk_category || "LOW"}
                  </Badge>
                </div>

                <div className="flex justify-between text-muted-foreground pt-1">
                  <span>Failure Probability:</span>
                  <span className="font-bold text-foreground">
                    {mlRisk.data?.failure_risk_percentage || 12}%
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground italic pt-1 border-t border-border/40">
                  <span className="font-semibold not-italic text-foreground">Recommendation: </span>
                  {mlRisk.data?.recommended_intervention ||
                    "Standard dispatch. Transit proceeding within parameters."}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            
            <CardHeader>
              <CardTitle>Sender</CardTitle>
              <CardDescription>Shipment sender information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <DetailRow
                icon={Building2}
                label="Name"
                value={shipment.senderName}
              />

              <DetailRow
                icon={Navigation}
                label="Phone"
                value={shipment.senderPhone}
              />

              <DetailRow
                icon={Package}
                label="Email"
                value={shipment.senderEmail}
              />

              <DetailRow
                icon={MapPin}
                label="Address"
                value={`${shipment.senderAddress},
${shipment.senderCity},
${shipment.senderState}
${shipment.senderPostalCode},
${shipment.senderCountry}`}
              />
            </CardContent>

            
          </Card>

          {/* Cargo */}
          <Card>
            <CardHeader>
              <CardTitle>Package</CardTitle>
              <CardDescription>Package information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow
                icon={Package}
                label="Tracking Number"
                value={shipment.trackingNumber}
              />

              <DetailRow
                icon={Truck}
                label="Shipment Type"
                value={shipment.shipmentType}
              />

              <DetailRow
                icon={Weight}
                label="Weight"
                value={`${shipment.packageWeightKg} kg`}
              />

              <DetailRow
                icon={Boxes}
                label="Package Type"
                value={shipment.packageType}
              />

              <DetailRow
                icon={DollarSign}
                label="Declared Value"
                value={formatCurrency(shipment.declaredValue)}
              />

              <DetailRow
                icon={Package}
                label="Description"
                value={shipment.packageDescription}
              />

              <DetailRow
                icon={Package}
                label="Priority"
                value={shipment.priority}
              />

              <DetailRow
                icon={Package}
                label="Status"
                value={shipment.status}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receiver</CardTitle>
              <CardDescription>Delivery recipient information</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <DetailRow
                icon={Building2}
                label="Name"
                value={shipment.receiverName}
              />

              <DetailRow
                icon={Navigation}
                label="Phone"
                value={shipment.receiverPhone}
              />

              <DetailRow
                icon={Package}
                label="Email"
                value={shipment.receiverEmail}
              />

              <DetailRow
                icon={MapPin}
                label="Address"
                value={`${shipment.receiverAddress},
${shipment.receiverCity},
${shipment.receiverState}
${shipment.receiverPostalCode},
${shipment.receiverCountry}`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}