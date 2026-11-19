import raw from "@/generated/content.json";
import type { Content, Item, Module } from "./items";

export const content = raw as unknown as Content;

export const modules: Module[] = content.modules;
export const items: Item[] = content.items;

export const moduleById = (id: string) => modules.find((m) => m.id === id);
export const itemsOf = (moduleId: string) => items.filter((i) => i.module === moduleId);
