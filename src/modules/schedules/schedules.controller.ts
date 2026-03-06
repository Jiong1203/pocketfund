import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { IsUUID } from "class-validator";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthUser } from "../auth/auth.types";
import { CreateScheduledTopUpDto } from "./dto/create-scheduled-topup.dto";
import { UpdateScheduledTopUpDto } from "./dto/update-scheduled-topup.dto";
import { SchedulesService } from "./schedules.service";

class ScheduleParamDto {
  @IsUUID()
  public id!: string;
}

@Controller("schedules")
export class SchedulesController {
  public constructor(private readonly schedulesService: SchedulesService) {}

  @Post("top-ups")
  public async create(@CurrentUser() user: AuthUser, @Body() dto: CreateScheduledTopUpDto) {
    return { data: await this.schedulesService.create(user.id, dto) };
  }

  @Get("top-ups")
  public async list(@CurrentUser() user: AuthUser) {
    return { data: await this.schedulesService.list(user.id) };
  }

  @Patch("top-ups/:id")
  public async update(
    @CurrentUser() user: AuthUser,
    @Param() params: ScheduleParamDto,
    @Body() dto: UpdateScheduledTopUpDto
  ) {
    return { data: await this.schedulesService.update(user.id, params.id, dto) };
  }

  @Delete("top-ups/:id")
  public async delete(@CurrentUser() user: AuthUser, @Param() params: ScheduleParamDto) {
    return { data: await this.schedulesService.delete(user.id, params.id) };
  }
}
