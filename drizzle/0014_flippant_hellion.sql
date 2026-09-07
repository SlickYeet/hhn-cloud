ALTER TABLE "ssh_key" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "ssh_key" ADD CONSTRAINT "ssh_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ssh_key_userId_idx" ON "ssh_key" USING btree ("user_id");