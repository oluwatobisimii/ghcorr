export interface NavLink {
  label: string;
  href: string;
  /** Orange highlight (e.g. the anniversary) */
  highlight?: boolean;
  external?: boolean;
  /** ISO instant; the link hides itself after this moment */
  hideAfter?: string;
}
export interface NavCta { label: string; href: string; external?: boolean; hideAfter?: string }
