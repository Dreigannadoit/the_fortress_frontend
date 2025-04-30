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
		String[] art = {
				"====================================================================== ",
				"DDDDDDDDDDD       RRRRRRRRRRRRR     EEEEEEEEEEEEEEE   IIIIIIIIIIIIIII  ",
				"DDD      DDDDD    RRR         RRR   EEE                     III        ",
				"DDD        DDDD   RRR      RRRRRR   EEE                     III        ",
				"DDD         DDD   RRRRRRRRRRRRR     EEEEEEEEEEEEEEE         III        ",
				"DDD        DDDD   RRR       RRRRR   EEE                     III        ",
				"DDD      DDDDD    RRR         RRR   EEE                     III        ",
				"DDDDDDDDDDD       RRR         RRR   EEEEEEEEEEEEEEE   IIIIIIIIIIIIIIII ",
				"====================================================================== ",
				"https://dreiabmab.com"
		};
		String[] bye = {
				"       _    (^)",
				"      (_\\   |_|",
				"       \\_\\  |_|",
				"       _\\_\\,/_|",
				"      (`\\(_|`\\|",
				"     (`\\,)  \\ \\",
				"      \\,)   | | ",
				"        \\__(__|",
				"====================================================================== ",
				"https://dreiabmab.com"
		};

		for (String line : art) System.out.println(line);

		SpringApplication.run(GameApiApplication.class, args);

		for (String line : bye) System.out.println(line);
	}

}
