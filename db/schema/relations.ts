import { relations } from "drizzle-orm";
import { machineries } from "./machineries";
import { materials } from "./materials";
import { profiles } from "./profiles";
import { reports } from "./reports";
import { sites } from "./sites";

export const sitesRelations = relations(sites, ({ many }) => ({
  reports: many(reports),
  users: many(profiles),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  site: one(sites, { fields: [profiles.siteId], references: [sites.id] }),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  site: one(sites, { fields: [reports.siteId], references: [sites.id] }),
  createdByUser: one(profiles, { fields: [reports.createdBy], references: [profiles.id] }),
  machineries: many(machineries),
  materials: many(materials),
}));

export const machineriesRelations = relations(machineries, ({ one }) => ({
  report: one(reports, { fields: [machineries.reportId], references: [reports.id] }),
}));

export const materialsRelations = relations(materials, ({ one }) => ({
  report: one(reports, { fields: [materials.reportId], references: [reports.id] }),
}));