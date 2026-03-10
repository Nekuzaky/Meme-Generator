declare module "*.jpg";
declare module "*.png";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";

interface NavigatorUAData {
  platform?: string;
}

interface Navigator {
  userAgentData?: NavigatorUAData;
}
