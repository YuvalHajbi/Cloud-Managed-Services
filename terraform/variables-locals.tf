locals {
  vpc_name       = "project" # might need to change
  vpc_cidr_block = "20.10.0.0/16"
  public_subnets = ["20.10.0.0/20", "20.10.16.0/20", "20.10.32.0/20"]
  common_tags = {
    project = "bulletin board" 
  }
  ec2_key_name  = "DSYkeypair" 
  app_ami       = "ami-01d2c7adb1654b168" 
  instance_type = "t2.micro"
}