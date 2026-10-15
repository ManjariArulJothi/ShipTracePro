import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTicket, useMyShipments, useShipments } from "@/lib/hooks";
import { mlApi } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LifeBuoy, ArrowLeft, Send, Sparkles, AlertCircle, CheckCircle2, Package } from "lucide-react";
import { toast } from "sonner";

export function CreateTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createTicket = useCreateTicket();

  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("standard");
  const [message, setMessage] = useState("");
  const [selectedTracking, setSelectedTracking] = useState("none");
  const [submitting, setSubmitting] = useState(false);

  // Fetch available shipments for user
  const isCustomer = user?.role === "customer";
  const { data: myShipments } = useMyShipments(isCustomer ? user?.id : null);
  const { data: allShipments } = useShipments();
  const rawShipments = isCustomer ? myShipments : (user?.role === "business_client" ? allShipments : (myShipments || allShipments));
  const shipments = Array.isArray(rawShipments) ? rawShipments : [];

  // Parcel selection helper
  const handleParcelSelect = (val) => {
    setSelectedTracking(val);
    if (val !== "none") {
      const pkg = shipments.find((s) => s.trackingNumber === val);
      const itemDesc = pkg?.packageDescription || pkg?.packageType || "Package";
      const receiver = pkg?.receiverName || pkg?.recipientName || "";
      const status = pkg?.status ? ` [Status: ${pkg.status}]` : "";

      if (!subject.trim() || subject.startsWith("Delivery Issue regarding")) {
        setSubject(`Delivery Issue: ${val} (${itemDesc})`);
      }
      if (!message.trim()) {
        const itemInfo = itemDesc ? ` regarding package contents '${itemDesc}'` : "";
        const destInfo = receiver ? ` addressed to ${receiver}` : "";
        setMessage(`Hello Support Team,\n\nI am reporting an issue with shipment ${val}${itemInfo}${destInfo}${status}.\n\nIssue Details: `);
      }
    }
  };

  // ML State
  const [mlAnalysis, setMlAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Trigger NLP classification on subject/message change (debounced)
  useEffect(() => {
    if (!subject.trim() && !message.trim()) {
      setMlAnalysis(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsAnalyzing(true);
        const result = await mlApi.classifyTicket({
          subject: subject.trim(),
          description: message.trim(),
        });
        setMlAnalysis(result);
      } catch (err) {
        console.warn("ML Classification unavailable:", err);
      } finally {
        setIsAnalyzing(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [subject, message]);

  const applyMlPriority = () => {
    if (!mlAnalysis) return;
    const prio = mlAnalysis.suggested_priority;
    if (prio === "URGENT") {
      setPriority("critical");
    } else if (prio === "HIGH") {
      setPriority("express");
    } else {
      setPriority("standard");
    }
    toast.success(`ML Priority '${prio}' applied!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    if (!message.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createTicket.mutateAsync({
        subject: subject.trim(),
        priority,
        message: message.trim(),
        shipmentTracking: selectedTracking !== "none" ? selectedTracking : null,
        customer: user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Customer",
        customerId: user?.id,
        customerEmail: user?.email,
        channel: "portal",
      });

      toast.success("Support ticket created successfully");
      navigate(`/app/tickets/${ticket.id}`);
    } catch {
      toast.error("Failed to create ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app/tickets")}
        className="mb-2"
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to Help Center
      </Button>

      <PageHeader
        title="Submit a Ticket"
        description="Describe the issue you're facing and our team will get back to you shortly"
        icon={LifeBuoy}
      />

      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>
            Provide details about your inquiry or link a specific shipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Related Parcel / Shipment Dropdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="parcel-select">Related Parcel / Shipment (Optional)</Label>
                <span className="text-[11px] text-muted-foreground">
                  Select a parcel or choose General Inquiry
                </span>
              </div>
              <Select value={selectedTracking} onValueChange={handleParcelSelect}>
                <SelectTrigger id="parcel-select" className="w-full">
                  <SelectValue placeholder="General Inquiry (No parcel selected)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                      <span>General Inquiry / Account Support (No parcel)</span>
                    </span>
                  </SelectItem>
                  {shipments.map((s) => {
                    const item = s.packageDescription || s.packageType || "Package";
                    const recipient = s.receiverName || s.recipientName || "";
                    return (
                      <SelectItem key={s.id || s.trackingNumber} value={s.trackingNumber}>
                        <span className="flex items-center gap-2 text-xs py-0.5">
                          <Package className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-mono font-semibold">{s.trackingNumber}</span>
                          <span className="font-semibold text-foreground">
                            • {item}
                          </span>
                          {recipient && (
                            <span className="text-muted-foreground truncate max-w-[180px]">
                              (To: {recipient})
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                            {s.status}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                placeholder="e.g. Shipment delayed, damaged parcel, delivery address change"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message / Description *</Label>
              <Textarea
                id="message"
                placeholder="Please explain the issue with any relevant tracking number or detail..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {/* ML NLP Real-time Insights Card */}
            {(mlAnalysis || isAnalyzing) && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2.5 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    🤖 AI / NLP Ticket Intelligence
                  </div>
                  {isAnalyzing && (
                    <span className="text-[11px] text-muted-foreground animate-pulse">
                      Analyzing intent...
                    </span>
                  )}
                </div>

                {mlAnalysis && !isAnalyzing && (
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground">Detected Intent:</span>
                      <Badge variant="outline" className="font-semibold bg-background">
                        {mlAnalysis.predicted_category?.replace(/_/g, " ")} ({Math.round(mlAnalysis.confidence * 100)}% match)
                      </Badge>

                      <span className="text-muted-foreground ml-2">Suggested Priority:</span>
                      <Badge
                        className={
                          mlAnalysis.suggested_priority === "URGENT"
                            ? "bg-rose-500 text-white"
                            : mlAnalysis.suggested_priority === "HIGH"
                              ? "bg-amber-500 text-white"
                              : "bg-blue-500 text-white"
                        }
                      >
                        {mlAnalysis.suggested_priority}
                      </Badge>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={applyMlPriority}
                        className="h-6 text-[11px] px-2 text-primary font-bold hover:bg-primary/10 ml-auto"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Apply Priority
                      </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      Sentiment: <span className="font-medium">{mlAnalysis.detected_sentiment}</span> • Auto-Routing: <span className="font-medium text-foreground">{mlAnalysis.auto_assigned_department}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard - General query</SelectItem>
                  <SelectItem value="express">Express - Needs attention</SelectItem>
                  <SelectItem value="critical">Critical - Urgent delivery issue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/app/tickets")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send className="mr-2 h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
