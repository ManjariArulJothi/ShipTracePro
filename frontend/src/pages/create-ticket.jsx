import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateTicket } from "@/lib/hooks";
import { useAuth } from "@/context/auth-context";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LifeBuoy, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

export function CreateTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createTicket = useCreateTicket();

  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("standard");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
            Provide details about your inquiry or shipment issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-1.5">
              <Label htmlFor="message">Message / Description *</Label>
              <Textarea
                id="message"
                placeholder="Please explain the issue with any relevant tracking number or detail..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
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
