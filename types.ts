
import React from 'react';

export enum ToolType {
  HOME = 'HOME',
  MICROWAVE = 'MICROWAVE',
  MATH_DRILL = 'MATH_DRILL',
  DRIVE_CONVERTER = 'DRIVE_CONVERTER',
  SQLITE_MANAGER = 'SQLITE_MANAGER',
  IMAGE_EDITOR = 'IMAGE_EDITOR',
  COLOR_PALETTE = 'COLOR_PALETTE',
  SEAT_CHANGE = 'SEAT_CHANGE',
  SVG_EDITOR = 'SVG_EDITOR',
  TIME_MANAGER = 'TIME_MANAGER',
  CALENDAR = 'CALENDAR',
  GITHUB_SYNC_GENERATOR = 'GITHUB_SYNC_GENERATOR',
}

export interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  colorClass: string;
}

export const WATT_OPTIONS = [500, 600, 700, 800, 900, 1000, 1200, 1500];

export enum DriveMode {
  PREVIEW = 'PREVIEW',
  DOWNLOAD = 'DOWNLOAD',
  VIEW = 'VIEW',
  VIDEO = 'VIDEO'
}
