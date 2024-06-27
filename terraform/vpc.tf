data "aws_availability_zones" "available" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.2.0"  
  
  name            = local.vpc_name
  cidr            = local.vpc_cidr_block
  azs             = data.aws_availability_zones.available.names
  public_subnets  = local.public_subnets
 
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.common_tags
  vpc_tags = local.common_tags
  map_public_ip_on_launch = true
}