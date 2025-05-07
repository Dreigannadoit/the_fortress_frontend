package com.utr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.utr")
@EntityScan("com.utr.gameapi.entity")
@EnableJpaRepositories(basePackages = "com.utr.gameapi.repository")
public class GameApiApplication {

	public static void main(String[] args) {
		final String RED_ON_BLACK = "\u001B[31;40m";
		final String BLUE_ON_BLACK = "\u001B[34;40m";
		final String YELLOW_ON_BLACK = "\u001B[33;40m";
		final String RESET = "\u001B[0m";

		String[] art = {
				"===============================================================================",
				"                                                                               ",
				"  ⬜⬜⬜⬜⬜⬜      ⬜⬜⬜⬜⬜⬜        ⬜⬜⬜⬜⬜⬜     ⬜⬜⬜⬜⬜⬜   ",
				"  ⬜⬜⬜⬜⬜⬜⬜    ⬜⬜⬜⬜⬜⬜⬜     ⬜⬜⬜⬜⬜⬜     ⬜⬜⬜⬜⬜⬜    ",
				"  ⬜⬜     ⬜⬜⬜    ⬜⬜       ⬜⬜    ⬜⬜                   ⬜⬜        ",
				"  ⬜⬜       ⬜⬜    ⬜⬜⬜⬜⬜⬜⬜     ⬜⬜⬜⬜⬜⬜         ⬜⬜         ",
				"  ⬜⬜       ⬜⬜    ⬜⬜⬜⬜⬜⬜       ⬜⬜⬜⬜⬜⬜         ⬜⬜         ",
				"  ⬜⬜     ⬜⬜⬜    ⬜⬜     ⬜⬜⬜    ⬜⬜                  ⬜⬜          ",
				"  ⬜⬜⬜⬜⬜⬜⬜    ⬜⬜        ⬜⬜    ⬜⬜⬜⬜⬜⬜    ⬜⬜⬜⬜⬜⬜     ",
				"  ⬜⬜⬜⬜⬜⬜      ⬜⬜        ⬜⬜    ⬜⬜⬜⬜⬜⬜    ⬜⬜⬜⬜⬜⬜     ",
				"                                                                                ",
				"================================================================================",
				"   |========================================================================|   ",
				"   |                                                                        |   ",
				"   |                 WELCOME TO THE 'UNTIL THEY RETURN' API                 |   ",
				"   |                            DEV, ROBERT BAMBA                           |   ",
				"   |                          https://dreiabmab.com                         |   ",
				"   |                                                                        |   ",
				"   |=============================================++=========================|   ",
				"                                                                                ",
		};
		String[] bye = {
				"======================================================",
				"                      _    (^)                        ",
				"                     (_\\   |_|                        ",
				"                      \\_\\  |_|                        ",
				"                      _\\_\\,/_|                        ",
				"                     (`\\(_|`\\|                        ",
				"                   (`\\,)  \\ \\                         ",
				"                     \\,)   | |                        ",
				"                       \\__(__|                        ",
				"        PEACE TO THOSE WHO TRY TO STEAL MY CODE       ",
				"======================================================",
				"                                                      ",
				"  API SUCCESSFULLY RUNNING AND CONNECTED TO DATABASE  ",
				"                                                      ",
				"======================================================",
				"                https://dreiabmab.com                 "
		};

		for (String line : art)  System.out.println(BLUE_ON_BLACK + line + RESET);

		SpringApplication.run(GameApiApplication.class, args);

		for (String line : bye) System.out.println(YELLOW_ON_BLACK + line + RESET);
	}

}
