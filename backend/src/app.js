import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import priceRoutes from "./routes/price.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import orderRoutes from "./routes/order.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import reportRoutes from "./routes/report.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10kb" }));


app.use('/api/auth', authRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);


app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'laundry-backend', time: new Date().toISOString()   });
});
export default app;