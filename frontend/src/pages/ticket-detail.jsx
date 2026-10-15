
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useTicket, useReplyTicket, useUpdateTicketStatus } from "@/lib/hooks";
import { useAuth } from "@/context/auth-context";
import { mlApi } from "@/lib/api";
import { LoadingState, EmptyState } from "@/components/shared/states";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, initials, formatDateTime, timeAgo } from "@/lib/utils";
import {
  ArrowLeft,
  Send,
  LifeBuoy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  ExternalLink,
  Sparkles,
  Bot,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

const statusMeta = {
  open: {
    label: "Open",
    class: "bg-destructive/10 text-destructive",
  },
  in_progress: {
    label: "In Progress",
    class: "bg-warning/15 text-warning",
  },
  resolved: {
    label: "Resolved",
    class: "bg-success/10 text-success",
  },
  closed: {
    label: "Closed",
    class: "bg-muted text-muted-foreground",
  },
};

export function TicketDetailPage() {
  const { id } = useParams();

  if (id === "new") {
    return <Navigate to="/app/tickets/new" replace />;
  }

  const { data: ticket, isLoading } = useTicket(id);
  const { user } = useAuth();
  const reply = useReplyTicket();
  const updateStatus = useUpdateTicketStatus();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [mlTriage, setMlTriage] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  // Classify ticket context with AI NLP Model
  useEffect(() => {
    if (!ticket) return;
    const desc = ticket.messages?.[0]?.body || ticket.subject || "";
    if (!desc.trim()) return;

    let isMounted = true;
    setIsClassifying(true);
    mlApi
      .classifyTicket({
        subject: ticket.subject,
        description: desc,
      })
      .then((res) => {
        if (isMounted) setMlTriage(res);
      })
      .catch((err) => console.warn("Ticket NLP unavailable:", err))
      .finally(() => {
        if (isMounted) setIsClassifying(false);
      });

    return () => {
      isMounted = false;
    };
  }, [ticket?.id, ticket?.subject]);

  const generateAiReply = (type = "auto") => {
    const custName = ticket.customer?.split(" ")[0] || "Customer";
    const trk = ticket.shipmentTracking ? ` for shipment ${ticket.shipmentTracking}` : "";

    if (type === "expedite") {
      setBody(
        `Hello ${custName},\n\nThank you for reaching out${trk}. I have reviewed your shipment telemetry and escalated this directly to our dispatch operations team to expedite delivery. You will receive real-time updates as the driver approaches doorstep handover.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
      );
    } else if (type === "address") {
      setBody(
        `Hi ${custName},\n\nThank you for providing the delivery update. I have dispatched your updated gate passcode and address instructions${trk} directly to the driver's onboard navigation console to ensure a smooth handover.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
      );
    } else if (type === "claim") {
      setBody(
        `Hi ${custName},\n\nWe sincerely apologize for the inconvenience caused${trk}. Our logistics compliance team is actively reviewing the incident. We have initiated a formal inquiry with the hub operator and will provide you with a resolution and replacement/credit update shortly.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
      );
    } else {
      // Dynamic Smart Draft based on Model 3 NLP intent
      const intent = mlTriage?.predicted_category;
      if (intent === "DAMAGED_PARCEL") {
        setBody(
          `Hi ${custName},\n\nWe are truly sorry to hear that your parcel arrived damaged. I have opened an investigation with the sorting hub inspection team and flagged this for expedited replacement/claim verification. Please retain the outer box while our operations team resolves this.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
        );
      } else if (intent === "LOST_PACKAGE") {
        setBody(
          `Hello ${custName},\n\nI understand your package is showing delivered but has not reached your hands. I have contacted the delivery driver to verify the GPS delivery geofence scan and will follow up with you within the hour.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
        );
      } else if (intent === "PAYMENT_BILLING") {
        setBody(
          `Hello ${custName},\n\nThank you for bringing this billing discrepancy to our attention. Our accounts team has verified your freight invoice and initiated the necessary adjustment. You will see the corrected statement shortly.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
        );
      } else {
        setBody(
          `Hello ${custName},\n\nThank you for contacting ShipTrack Support${trk}. Our logistics team is actively monitoring your consignment and ensuring prompt transit. Please let us know if you have any questions.\n\nBest regards,\n${user.name ?? user.firstName ?? "Support Agent"}`
        );
      }
    }
    toast.success("AI draft response generated!");
  };

  if (isLoading) {
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
        <LoadingState label="Loading ticket…" />
      </div>
    );
  }

  if (!ticket) {
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
          icon={LifeBuoy}
          title="Ticket not found"
          action={
            <Button asChild>
              <Link to="/app/tickets">View all tickets</Link>
            </Button>
          }
        />
      </div>
    );
  }

  // const isStaff = user.role === "support" || user.role === "admin";
  const isStaff = user?.role === "support_agent" || user?.role === "admin";

  const handleReply = async () => {
    if (!body.trim()) return;
    await reply.mutateAsync({
      id: ticket.id,
      body,
      author: user.name ?? user.firstName,
    });
    setBody("");
    toast.success("Reply sent");
  };

  const handleStatusChange = async (status) => {
    await updateStatus.mutateAsync({
      id: ticket.id,
      status,
    });
    toast.success(`Ticket marked as ${statusMeta[status].label}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
              <h1 className="text-lg font-bold">{ticket.subject}</h1>
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-medium",
                  statusMeta[ticket.status].class,
                )}
              >
                {statusMeta[ticket.status].label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{ticket.reference} · opened {timeAgo(ticket.createdAt)}</span>
              {ticket.shipmentTracking && (
                <Link
                  to={`/app/track`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-xs font-semibold hover:bg-primary/20 transition"
                  title="Track this parcel"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span>Parcel: {ticket.shipmentTracking}</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </div>
        {isStaff && (
          <Select
            value={ticket.status}
            onValueChange={(v) => handleStatusChange(v)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">
                <AlertCircle className="mr-2 h-4 w-4" />
                Open
              </SelectItem>
              <SelectItem value="in_progress">
                <Clock className="mr-2 h-4 w-4" />
                In Progress
              </SelectItem>
              <SelectItem value="resolved">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Resolved
              </SelectItem>
              <SelectItem value="closed">
                <XCircle className="mr-2 h-4 w-4" />
                Closed
              </SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conversation</CardTitle>
              <CardDescription>
                {ticket.messages.length} messages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.messages.map((m) => {
                // const isMe = m.author === user.name;
                const isMe = m.author === (user.name ?? user.firstName);
                return (
                  <div
                    key={m.id}
                    className={cn("flex gap-3", isMe && "flex-row-reverse")}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback
                        className={cn(
                          "text-xs font-semibold",
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {initials(m.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        isMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <p className="text-xs font-semibold opacity-80">
                        {m.author}
                      </p>
                      <p className="mt-0.5 text-sm">{m.body}</p>
                      <p
                        className={cn(
                          "mt-1 text-[10px]",
                          isMe
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground",
                        )}
                      >
                        {formatDateTime(m.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {ticket.status !== "closed" && (
            <Card className="mt-4">
              <CardContent className="p-4 space-y-3">
                {/* AI Copilot Reply Suggestions */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Copilot Smart Replies:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => generateAiReply("auto")}
                      className="h-7 text-xs font-medium border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Wand2 className="h-3 w-3 mr-1" />
                      Auto-Draft
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAiReply("expedite")}
                      className="h-7 text-xs font-medium hover:bg-primary/10"
                    >
                      ⚡ Expedite
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAiReply("address")}
                      className="h-7 text-xs font-medium hover:bg-primary/10"
                    >
                      📍 Gate/Address
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAiReply("claim")}
                      className="h-7 text-xs font-medium hover:bg-primary/10"
                    >
                      🛡️ Claim/Refund
                    </Button>
                  </div>
                </div>

                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your reply, or click an AI Copilot Smart Reply above…"
                  className="min-h-[100px] resize-none border-0 p-0 focus-visible:ring-0"
                />
                <Separator className="my-2" />
                <div className="flex justify-end">
                  <Button
                    onClick={handleReply}
                    disabled={!body.trim() || reply.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {reply.isPending ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {/* AI NLP Triage Card */}
          <Card className="border border-primary/30 bg-primary/[0.02]">
            <CardHeader className="pb-2.5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-primary" />
                  <span>AI Triage & Telemetry</span>
                </CardTitle>
                {isClassifying && (
                  <span className="text-[10px] text-muted-foreground animate-pulse">
                    Analyzing...
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Detected Intent</span>
                <Badge variant="outline" className="font-semibold text-[11px] bg-background">
                  {mlTriage?.predicted_category?.replace(/_/g, " ") || "CLASSIFYING..."}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium text-foreground">
                  {mlTriage ? `${Math.round(mlTriage.confidence * 100)}% match` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Customer Sentiment</span>
                <Badge
                  className={cn(
                    "text-[10px] font-bold uppercase",
                    mlTriage?.detected_sentiment === "NEGATIVE"
                      ? "bg-rose-500 text-white"
                      : mlTriage?.detected_sentiment === "MIXED"
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                  )}
                >
                  {mlTriage?.detected_sentiment || "NEUTRAL"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Routing Dept</span>
                <span className="font-medium text-[11px]">
                  {mlTriage?.auto_assigned_department?.replace(/_/g, " ") || "CUSTOMER CARE"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ticket Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="Customer" value={ticket.customer} />
              {ticket.shipmentTracking && (
                <InfoRow
                  label="Related Parcel"
                  value={
                    <Link
                      to="/app/track"
                      className="font-mono text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {ticket.shipmentTracking}
                    </Link>
                  }
                />
              )}
              <InfoRow
                label="Channel"
                value={<span className="capitalize">{ticket.channel}</span>}
              />
              <InfoRow
                label="Priority"
                value={
                  <Badge variant="outline" className="capitalize">
                    {ticket.priority}
                  </Badge>
                }
              />
              <InfoRow label="Assignee" value={ticket.assignee} />
              <InfoRow
                label="Created"
                value={formatDateTime(ticket.createdAt)}
              />
              <InfoRow label="Updated" value={timeAgo(ticket.updatedAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Customer</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                  {initials(ticket.customer)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold">{ticket.customer}</p>
                <p className="text-xs text-muted-foreground">
                  Customer account
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}