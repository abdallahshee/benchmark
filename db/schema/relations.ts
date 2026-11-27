import { relations } from "drizzle-orm";

import { machineries } from "./machineries";
import { materials } from "./materials";
import { profiles } from "./profiles";
import { reports } from "./reports";
import { sites } from "./sites";
import { workers } from "./workers";
import { siteWorkers } from "./site-workers";
import { reportWorkers } from "./report-workers";

// Sites
export const sitesRelations = relations(sites, ({ many }) => ({
  reports: many(reports),
  users: many(profiles),
  workers: many(siteWorkers),
}));

// Profiles
export const profilesRelations = relations(profiles, ({ one }) => ({
  site: one(sites, {
    fields: [profiles.siteId],
    references: [sites.id],
  }),
}));

// Reports
export const reportsRelations = relations(reports, ({ one, many }) => ({
  site: one(sites, {
    fields: [reports.siteId],
    references: [sites.id],
  }),

  createdByUser: one(profiles, {
    fields: [reports.createdBy],
    references: [profiles.id],
  }),

  machineries: many(machineries),
  materials: many(materials),
  workers: many(reportWorkers),
}));

// Machineries
export const machineriesRelations = relations(machineries, ({ one }) => ({
  report: one(reports, {
    fields: [machineries.reportId],
    references: [reports.id],
  }),
}));

// Materials
export const materialsRelations = relations(materials, ({ one }) => ({
  report: one(reports, {
    fields: [materials.reportId],
    references: [reports.id],
  }),
}));

// Workers
export const workersRelations = relations(workers, ({ many }) => ({
  sites: many(siteWorkers),
  reports: many(reportWorkers),
}));

// Site Workers (worker-site assignments)
export const siteWorkersRelations = relations(
  siteWorkers,
  ({ one }) => ({
    site: one(sites, {
      fields: [siteWorkers.siteId],
      references: [sites.id],
    }),

    worker: one(workers, {
      fields: [siteWorkers.workerId],
      references: [workers.id],
    }),
  }),
);

// Report Workers (daily attendance)
export const reportWorkersRelations = relations(
  reportWorkers,
  ({ one }) => ({
    report: one(reports, {
      fields: [reportWorkers.reportId],
      references: [reports.id],
    }),

    worker: one(workers, {
      fields: [reportWorkers.workerId],
      references: [workers.id],
    }),
  }),
);