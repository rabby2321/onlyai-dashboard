/*
  Warnings:

  - A unique constraint covering the columns `[host,port]` on the table `Endpoint` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Endpoint_host_port_key" ON "public"."Endpoint"("host", "port");
