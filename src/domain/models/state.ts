import {
  type Role,
  type Customer,
  type Driver,
  type Session,
  type Account,
} from "./identity";
import { type Order } from "./order";
import { type TimeSlot } from "./fulfillment";
export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  text: string;
  timestamp: string;
}
export interface NotificationItem {
  id: string;
  customerId: string;
  title: string;
  body: string;
  category: string;
  timeAgo: string;
  isRead: boolean;
  relatedOrderId?: string;
}
export interface AppState {
  version: 1;
  customers: Customer[];
  driver: Driver;
  session: Session | null;
  accounts: Account[];
  orders: Order[];
  notifications: NotificationItem[];
  chatMessages: Record<string, ChatMessage[]>;
  timeSlots: TimeSlot[];
}
