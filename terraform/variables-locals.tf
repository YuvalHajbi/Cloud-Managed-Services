locals {
  vpc_name       = "project" # might need to change
  vpc_cidr_block = "20.10.0.0/16"
  public_subnets = ["20.10.0.0/20", "20.10.16.0/20", "20.10.32.0/20"]
  common_tags = {
    project = "bulletin board" 
  }
  ec2_key_name  = "DSY" 
  app_ami       = "ami-050f8a40b32f3d53d" 
  instance_type = "t2.micro"
}